## 2026-02-11 - [String Parsing Optimization Attempt]
**Experiment:** Attempted to replace `String.prototype.split(" ")` with manual character scanning using `indexOf` and `substring` in `UCIParser.parseInfo` to reduce array allocations.
**Result:** Manual scanning was significantly slower (~4x; 160ms vs 40ms for 100k iterations) in V8 benchmarks.
**Learning:** V8's native `split` implementation is highly optimized for short, space-delimited strings. The overhead of executing JavaScript logic for every token outweighs the memory allocation cost of `split`.
**Action:** Reverted the manual parsing change. Instead, implemented regex pre-compilation for `createSearchCommand` in `UCIParser` and `USIParser` to prevent re-compilation overhead, ensuring a safe and correct optimization.
