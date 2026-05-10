// Bench data hierarchy — re-exports.
//
//   Bench   (top — the standardized 112-run, or a custom plan)
//     └─ Batch     (c-level group of Runs — e.g. c=16 ×2)
//        └─ Run    (single parallel launch of N Tests)
//           └─ Test  (one slot — prompt → HTML stream)

export { Test } from './Test';
export { Run, type RunSummary } from './Run';
export { Batch } from './Batch';
export { Tier } from './Tier';
export { Bench } from './Bench';
