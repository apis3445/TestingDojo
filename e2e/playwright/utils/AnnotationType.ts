// Test-level metadata pushed to test.info().annotations in the spec's annotation array only.
// Never use these inside page objects or components.
export enum AnnotationType {
    Precondition = 'Pre Condition',  // What must be true before the test starts
    PostCondition = 'Post Condition', // Cleanup or state to verify after the test
    Description = 'Description',     // One-line summary of what the test verifies
}
