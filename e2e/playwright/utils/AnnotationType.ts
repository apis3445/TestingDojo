// Labels that appear in the Playwright HTML report for each test step.
// Using these consistently makes the report readable to anyone, not just the developer who wrote the test.
export enum AnnotationType {
    Precondition = 'Pre Condition',  // What must be true before the test starts (e.g. "Admin user must exist")
    PostCondition = 'Post Condition', // Cleanup or state to verify after the test
    Description = 'Description',     // One-line summary of what the test verifies
    GoTo = 'Go To',                  // A browser navigation step
    Step = 'Step',                   // Any user interaction: click, fill, etc.
    Assert = 'Assert',               // A verification / expectation
    Mock = 'Mock',                   // When a network response is intercepted and replaced with fake data
    Data = 'Data'                    // Test data being used (e.g. the username or search term)
}
