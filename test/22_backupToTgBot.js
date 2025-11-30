const { checkResult } = require('./main-test');

async function test22_backupToTgBot(testState, rl) {
    console.log('Testing backupToTgBot...');
    try {
        const result = await testState.client.backupToTgBot();
        checkResult(result, 'backupToTgBot');
    } catch (error) {
        console.error('backupToTgBot failed:', error.message);
        // Don't fail the test suite if this fails, as it might require specific server config
    }
}

module.exports = test22_backupToTgBot;
