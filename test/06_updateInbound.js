// Test 06: Update Inbound with Simplified Logic (Test-Created Inbounds Only)
async function test06_updateInbound(testState) {
    try {
        // SAFETY: Only update inbounds that were created during testing
        const inboundId = testState.createdInboundId;

        if (!inboundId) {
            return {
                success: false,
                message: 'No test-created inbound available to update. Run addInbound (Test 05) first.',
                error: 'Missing test-created inbound ID',
                note: 'This test only updates inbounds created during testing for safety.',
                skipped: true
            };
        }

        console.log(`🔄 Updating TEST-CREATED inbound ID: ${inboundId} with auto-session...`);
        console.log('   ⚠️  Safety: Only updating inbounds created during testing');

        // OLD WAY: Complex settings parsing and reconstruction
        // NEW WAY: Simple, focused updates

        // First get current inbound to preserve existing settings
        const currentInbound = await testState.client.getInbound(inboundId);

        if (!currentInbound.success || !currentInbound.obj) {
            return {
                success: false,
                message: `Could not retrieve inbound ${inboundId} for updating`,
                error: 'Inbound not found'
            };
        }

        // Create simple update with preserved settings
        const updatedConfig = {
            ...currentInbound.obj,
            remark: `Updated_Auto_${Date.now()}`,
            enable: true
        };

        console.log(`   Old remark: ${currentInbound.obj.remark}`);
        console.log(`   New remark: ${updatedConfig.remark}`);

        // AUTO-SESSION: No manual authentication needed!
        const result = await testState.client.updateInbound(inboundId, updatedConfig);

        if (result.success) {
            console.log('✅ Inbound updated successfully with auto-session');
        }

        return {
            ...result,
            updateDetails: {
                inboundId: inboundId,
                oldRemark: currentInbound.obj.remark,
                newRemark: updatedConfig.remark,
                sessionAutoManaged: true
            },
            coding_comparison: {
                oldWay: 'Complex settings parsing + manual JSON reconstruction',
                newWay: 'Simple object spread + focused updates'
            },
            benefits: [
                'Automatic session management',
                'Simplified update logic',
                'Preserved existing configuration',
                'Error-resistant approach'
            ]
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            error: error.message,
            note: 'Session handling automated even during update errors'
        };
    }
}

module.exports = test06_updateInbound;