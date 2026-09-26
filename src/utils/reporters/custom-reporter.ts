import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class BankingCustomReporter implements Reporter {
  onBegin(config: any, suite: any) {
    console.log(`Starting the execution of ${suite.allTests().length} banking tests`);
  }

  onTestBegin(test: TestCase) {
    console.log(`[BANKING-TEST-START] ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`[BANKING-TEST-END] ${test.title} : ${result.status}`);
    if (result.status !== 'passed') {
        console.error(`Error details: ${result.error?.message}`);
    }
  }

  onEnd(result: any) {
    console.log(`Execution finished with status: ${result.status}`);
  }
}

export default BankingCustomReporter;
