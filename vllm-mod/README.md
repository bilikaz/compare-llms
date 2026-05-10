# vllm-mod — HTTP/2 reverse proxy for vLLM

A drop-in mod for [eugr/spark-vllm-docker](https://github.com/eugr/spark-vllm-docker) that puts a tiny HTTP/2 + TLS proxy (Caddy) in front of vLLM on the same box. Without it, browser-based clients like compare-llms cap at 6 concurrent requests per origin (HTTP/1.1 limit) — so any benchmark above `c=6` is being throttled by the network, not the model.

## Why you need it

vLLM's API server (`uvicorn`) only speaks HTTP/1.1. Every modern browser caps concurrent HTTP/1.1 requests at **6 per origin** — Chrome's hard-coded limit, Firefox's `network.http.max-persistent-connections-per-server` default. Above c=6, the browser queues client-side. The extra requests never even leave the browser.

Symptoms you'll see:

- vLLM's log shows `Running: 6 reqs · Waiting: 0` no matter what `c` you ask for.
- compare-llms' Concurrency Stats card shows `avg ch/s` plateau or even *fall* as `c` grows past 6, because slots are serialized by the browser.
- Per-c throughput numbers don't reflect what your server can actually do.

The fix is **HTTP/2**: a single multiplexed TLS connection carries hundreds of streams, so c=N actually reaches the server. Browsers only speak HTTP/2 over TLS (`h2`) — they refuse `h2c` (cleartext HTTP/2) — so you need a TLS cert too.

This mod adds a static-binary Caddy that:

- Terminates TLS with a leaf cert generated locally (its own CA, IPs in SANs).
- Speaks HTTP/2 to the browser.
- Reverse-proxies plain HTTP to vLLM on `localhost:8000` (no vLLM changes needed).

## Background: eugr/spark-vllm-docker

This mod is for [eugr/spark-vllm-docker](https://github.com/eugr/spark-vllm-docker), a vLLM container setup tuned for DGX Spark / multi-GPU clusters. It comes with a **mods system** — `./launch-cluster.sh --apply-mod ./mods/<name>` runs each mod's `run.sh` inside the container at launch, so you can patch behavior without rebuilding the image.

This `vllm-mod/` folder is structured exactly like one of those mods. To install it, copy it into your spark-vllm-docker checkout:

```bash
cp -r /path/to/compare-llms/vllm-mod ~/spark-vllm-docker/mods/http2-proxy
```

Then apply on launch alongside any other mods:

```bash
./launch-cluster.sh --apply-mod ./mods/http2-proxy
```

## Setup

After copying the mod into `spark-vllm-docker/mods/http2-proxy/`:

1. **Apply on launch.**
   ```bash
   ./launch-cluster.sh --apply-mod ./mods/http2-proxy
   ```
   First apply downloads the Caddy binary (~50 MB), generates a CA + leaf cert. Subsequent applies reuse both.

2. **Open the firewall on the vLLM box.**
   ```bash
   sudo ufw allow 8443/tcp     # HTTPS reverse proxy
   sudo ufw allow 8481/tcp     # plain-HTTP /_root.crt for trust bootstrap
   ```

3. **Trust the CA on each workstation, once.** The mod prints the exact commands at apply time with your box's IP filled in. The gist:

   **Linux** (system trust store; covers Chrome/Edge/curl):
   ```bash
   curl -fsSL http://<box-ip>:8481/_root.crt \
     | sudo tee /usr/local/share/ca-certificates/vllm-local-ca.crt > /dev/null
   sudo update-ca-certificates
   ```

   **Firefox** has its own trust store regardless of OS:
   - Settings → Privacy & Security → Certificates → View Certificates → **Authorities → Import** the same `.crt` file (download it first with `curl -o vllm-root.crt http://<box-ip>:8481/_root.crt`).

   **macOS**:
   ```bash
   curl -fsSL http://<box-ip>:8481/_root.crt -o /tmp/vllm-root.crt
   sudo security add-trusted-cert -d -r trustRoot \
     -k /Library/Keychains/System.keychain /tmp/vllm-root.crt
   ```

   The CA persists on the host (see Persistence below), so this trust step is once-per-workstation, not once-per-launch.

4. **Verify.**
   ```bash
   curl -v https://<box-ip>:8443/v1/models    # no -k; should validate cleanly
   ```

5. **Point compare-llms at it.** Model card → Base URL = `https://<box-ip>:8443/v1`. Run a Standardized 112-run; vLLM's log should show `Running:` climb to 16 during easy phases.

## What's in the mod

```
vllm-mod/
├── README.md     ← this file
├── Caddyfile     ← template; placeholders filled at apply time
├── run.sh        ← invoked by launch-cluster.sh inside the container
└── .gitignore    ← excludes any locally-staged data dirs
```

`run.sh`, in order:

1. Caches Caddy as a static binary at `/root/.cache/vllm/http2-proxy/bin/caddy-<ver>-linux-<arch>`. Downloaded only on first apply; reused thereafter.
2. Generates a CA with `openssl req -x509` (only on first apply, persisted forever).
3. Issues a leaf cert signed by that CA, with the box's auto-detected IPs in `subjectAltName`. Re-issued only when the SAN list changes.
4. Renders the Caddyfile template into `/etc/caddy/Caddyfile` with cert paths, ports, and upstream filled in.
5. Stops any old Caddy from a previous apply, starts the new one detached, and prints workstation-side instructions with the box's actual IP.

## Persistence

`launch-cluster.sh` `docker cp`'s mods into `/workspace/mods/<name>` inside the container — that path is **not** host-mounted, so anything written there vanishes on container removal.

To make the cached binary, CA, and leaf cert survive container rebuilds, the mod stores everything under `/root/.cache/vllm/http2-proxy/`, which IS bind-mounted from `$HOME/.cache/vllm` on the host (see `launch-cluster.sh`'s `MOUNT_CACHE_DIRS` block).

After the first apply the host-side layout is:
```
~/.cache/vllm/http2-proxy/
├── bin/caddy-2.8.4-linux-arm64       (downloaded once)
├── ca/{ca.crt, ca.key}               (CA — never regenerated)
├── leaf/{leaf.crt, leaf.key, .sans}  (re-issued only when IPs change)
├── public-pki/_root.crt              (symlink to ca.crt; served on :8481)
├── caddy.log                         (tail this if anything misbehaves)
└── caddy.pid
```

If you launch with `--no-cache-dirs`, the bind mount is gone, the mod prints a warning, and falls back to ephemeral container storage (CA regenerates every restart → workstations would have to re-trust). Set `HTTP2_PROXY_CACHE=/some/host-mounted/path` to override.

## Tunables

All env vars are optional and have sane defaults.

| Var | Default | Purpose |
|---|---|---|
| `HTTP2_PROXY_PORT`        | `8443`              | HTTPS listener |
| `HTTP2_PROXY_TRUST_PORT`  | `8481`              | Plain-HTTP listener serving `/_root.crt` |
| `HTTP2_PROXY_UPSTREAM`    | `localhost:8000`    | Where Caddy forwards (your vLLM) |
| `HTTP2_PROXY_HOSTS`       | autodetected via `hostname -I` | Comma-separated IPs/hostnames to put in the leaf cert's SANs (use this for clusters: `192.168.1.66,192.168.1.67`) |
| `HTTP2_PROXY_CACHE`       | `/root/.cache/vllm/http2-proxy` | Persistent storage path inside the container |
| `CADDY_VERSION`           | `2.8.4`             | Version of the static binary to cache |

Set them in your shell before `--apply-mod`, or in your spark-vllm-docker recipe's `env:` block.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `curl https://<box>:8443/...` says `connection refused` | ufw blocking, or Caddy didn't start | `sudo ufw allow 8443/tcp 8481/tcp`; check `~/.cache/vllm/http2-proxy/caddy.log` |
| Browser: `SSL_ERROR_INTERNAL_ERROR_ALERT` | Leaf cert SANs don't include the IP you're hitting | Set `HTTP2_PROXY_HOSTS=` with the right IP and re-apply (the mod re-issues the leaf when SANs change) |
| Browser: cert is "untrusted" / red bar | You haven't trusted the CA on this workstation yet | Run the trust one-liner the mod printed at apply time |
| vLLM log still capping at `Running: 6` | The browser is still hitting vLLM directly on `:8000` (HTTP/1.1), not Caddy on `:8443` | Double-check the model card's Base URL is `https://<box-ip>:8443/v1` |
| `[http2-proxy] WARN: cannot write to ...` | You launched with `--no-cache-dirs` so the persistence mount is gone | Re-launch without `--no-cache-dirs`, or set `HTTP2_PROXY_CACHE=` to another mounted path |
| Trust port (8080) clashes with Ray dashboard etc. | Default trust port collided | Mod's default is `8481` — set `HTTP2_PROXY_TRUST_PORT` if 8481 is also taken |

## Why this lives in compare-llms

compare-llms reports per-concurrency throughput stats — the moment a slot finishes in a c=N batch, the effective concurrency drops to N-1, so the stats card only counts the window where all N slots were truly in flight. Those numbers are only meaningful when the network actually delivers c=N parallelism end-to-end. With HTTP/1.1 + 6-connection cap, the "c=12 throughput" is just "c=6 throughput repeated twice." Hence the mod ships in the same repo as the client that depends on it.
