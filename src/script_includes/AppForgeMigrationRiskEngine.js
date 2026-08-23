/**
 * AppForgeMigrationRiskEngine
 * Calculates risk classifications (LOW, MEDIUM, HIGH, CRITICAL) for schema evolutions and data migrations.
 */
var AppForgeMigrationRiskEngine = Class.create();
AppForgeMigrationRiskEngine.prototype = {
    initialize: function() {
        'use strict';
        this.LOG_PREFIX = '[AppForgeMigrationRiskEngine] ';
    },

    /**
     * Assesses risk for a planned migration.
     * @param {Object} migrationDef - Migration definition.
     * @param {number} estimatedRecords - Estimated record count.
     * @param {string} targetEnvironment - Target environment name.
     * @return {Object} { risk_level: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL', score: number, factors: Array }
     */
    calculateRisk: function(migrationDef, estimatedRecords, targetEnvironment) {
        'use strict';
        var score = 0;
        var factors = [];
        var count = estimatedRecords || 0;
        var isProd = (targetEnvironment || '').toUpperCase() === 'PRODUCTION';

        if (isProd) {
            score += 30;
            factors.push('Production target environment (+30)');
        }

        if (count > 1000000) {
            score += 50;
            factors.push('Ultra high volume (>1M records) (+50)');
        } else if (count > 50000) {
            score += 30;
            factors.push('High volume (>50k records) (+30)');
        } else if (count > 1000) {
            score += 15;
            factors.push('Moderate volume (>1k records) (+15)');
        } else {
            score += 5;
            factors.push('Low volume (<=1k records) (+5)');
        }

        if (migrationDef && migrationDef.operations) {
            for (var i = 0; i < migrationDef.operations.length; i++) {
                var op = migrationDef.operations[i];
                var opType = (op.operation_type || op.type || '').toUpperCase();
                if (opType === 'DROP_FIELD' || opType === 'DROP_TABLE' || opType === 'MASS_DELETE') {
                    score += 100;
                    factors.push('Destructive schema operation: ' + opType + ' (+100)');
                } else if (opType === 'MAP_REFERENCE' || opType === 'ADD_REFERENCE') {
                    score += 20;
                    factors.push('Reference data migration (+20)');
                } else if (op.rollback_strategy === 'NON_REVERSIBLE') {
                    score += 40;
                    factors.push('Non-reversible operation detected (+40)');
                }
            }
        }

        var riskLevel = 'LOW';
        if (score >= 80) {
            riskLevel = 'CRITICAL';
        } else if (score >= 50) {
            riskLevel = 'HIGH';
        } else if (score >= 25) {
            riskLevel = 'MEDIUM';
        }

        return {
            risk_level: riskLevel,
            score: score,
            factors: factors
        };
    },

    type: 'AppForgeMigrationRiskEngine'
};
