// Test 19: Create Backup
async function test19_createBackup(testState, rl) {
    function askQuestion(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        console.log('💾 Creating backup...');
        console.log('⚠️  WARNING: This will create a backup of the current 3X-UI configuration!');

        const confirmation = await askQuestion('Are you sure you want to create a backup? (yes/y/no/n): ');

        const isConfirmed = confirmation.toLowerCase().startsWith('y') || confirmation.toLowerCase() === 'yes';

        if (!isConfirmed) {
            return {
                success: false,
                message: 'Operation cancelled by user',
                cancelled: true
            };
        }

        console.log('   Creating backup...');

        const result = await testState.client.createBackup();

        // Return the raw API response
        return result;
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message
        };
    }
}

module.exports = test19_createBackup;