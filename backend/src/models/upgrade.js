// `sequelize.sync()` creates missing tables but never changes existing ones. Columns added to a
// model after its table was created go here: on start, each one is added if the table lacks it,
// so an older database needs no manual SQL.
import { DataTypes } from 'sequelize';

const ADDED_COLUMNS = [
    // 2026-11-22: the app's language per phone, for notifications in it.
    { table: 'push_tokens', column: 'language', definition: { type: DataTypes.STRING(8), allowNull: true } },
];

export const addMissingColumns = async sequelize => {
    const queries = sequelize.getQueryInterface();
    for (const { table, column, definition } of ADDED_COLUMNS) {
        const existing = await queries.describeTable(table);
        if (!existing[column]) {
            await queries.addColumn(table, column, definition);
            console.log(`Database: added ${table}.${column}.`);
        }
    }
};
