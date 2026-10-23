import pool from '../../config/db.js';

const initializeSALeavePolicyModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_leave_policies (
            id SERIAL PRIMARY KEY,
            company_id INT REFERENCES sa_company_profiles(id) ON DELETE CASCADE,
            branch_id INT REFERENCES sa_branches(id) ON DELETE CASCADE,
            casual_leave INT DEFAULT 0,
            sick_leave INT DEFAULT 0,
            earned_leave INT DEFAULT 0,
            carry_forward_status VARCHAR(50) DEFAULT 'Disabled',
            max_carry_forward INT DEFAULT 0,
            maximum_leave_per_month INT DEFAULT 0,
            approval_workflow VARCHAR(255) DEFAULT 'Employee -> Superadmin -> Approved',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterColumns = [
        "ADD COLUMN IF NOT EXISTS company_id INT REFERENCES sa_company_profiles(id) ON DELETE CASCADE",
        "ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES sa_branches(id) ON DELETE CASCADE",
        "ADD COLUMN IF NOT EXISTS casual_leave INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS sick_leave INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS earned_leave INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS carry_forward_status VARCHAR(50) DEFAULT 'Disabled'",
        "ADD COLUMN IF NOT EXISTS max_carry_forward INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS maximum_leave_per_month INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS approval_workflow VARCHAR(255) DEFAULT 'Employee -> Superadmin -> Approved'",
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER COLUMN approval_workflow TYPE VARCHAR(255)",
        "ALTER COLUMN carry_forward_status TYPE VARCHAR(50)"
    ];

    const dropProblematicConstraintsQuery = `
        DO $$ 
        BEGIN
            -- Drop the problematic unique constraint that causes 42P10 ON CONFLICT errors
            ALTER TABLE sa_leave_policies DROP CONSTRAINT IF EXISTS unique_policy_per_branch;
        END $$;
    `;

    try {
        await pool.query(createTableQuery);
        
        for (const alterQuery of alterColumns) {
            try {
                await pool.query(`ALTER TABLE sa_leave_policies ${alterQuery};`);
            } catch (colErr) {
                if (colErr.code !== '42710') {
                    console.warn(`Warning mapping SALeavePolicy column: ${alterQuery}`, colErr.message);
                }
            }
        }

        try {
            await pool.query(dropProblematicConstraintsQuery);
        } catch (constraintErr) {
            console.warn(`Warning dropping legacy constraints:`, constraintErr.message);
        }
        
        console.log('SALeavePolicy table and constraints checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SALeavePolicy table:', error);
    }
};

export default initializeSALeavePolicyModel;