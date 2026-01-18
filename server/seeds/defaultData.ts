
import { UnifiedDatabase } from "../database";
import { createWorkflow } from "../stores/workflowStore";
import { createStyleTemplate } from "../stores/templateStore";
import { DEFAULT_WORKFLOWS, DEFAULT_TEMPLATES } from "../data/defaults";

export const seedDefaultData = async (db: UnifiedDatabase) => {
    try {
        // Check Workflows
        const workflowsCount = await db.queryOne<{ count: number }>(
            "SELECT COUNT(*) as count FROM workflows"
        );

        if (workflowsCount && workflowsCount.count === 0) {
            console.log("Creating default workflows...");
            for (const w of DEFAULT_WORKFLOWS) {
                await createWorkflow(db, w);
            }
            console.log(`Created ${DEFAULT_WORKFLOWS.length} default workflows.`);
        }

        // Check Templates
        const templatesCount = await db.queryOne<{ count: number }>(
            "SELECT COUNT(*) as count FROM style_templates"
        );

        if (templatesCount && templatesCount.count === 0) {
            console.log("Creating default templates...");
            for (const t of DEFAULT_TEMPLATES) {
                await createStyleTemplate(db, t);
            }
            console.log(`Created ${DEFAULT_TEMPLATES.length} default templates.`);
        }
    } catch (error) {
        console.error("Error seeding default data:", error);
        // Don't throw, we want the server to start even if seeding fails
    }
};
