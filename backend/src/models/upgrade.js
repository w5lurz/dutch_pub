// `sequelize.sync()` creates missing tables but never changes existing ones. Columns and unique
// indexes added to a model after its table was created go here: on start, each is added if the
// table lacks it, so an older database needs no manual SQL.
import { DataTypes } from 'sequelize';

const ADDED_COLUMNS = [
    // 2026-11-22: the app's language per phone, for notifications in it.
    { table: 'push_tokens', column: 'language', definition: { type: DataTypes.STRING(8), allowNull: true } },
];

/** Unique columns (new databases get them from the model). Logging in by email needs both unique. */
const UNIQUE_COLUMNS = [
    { table: 'users', column: 'username', name: 'users_username_unique' },
    { table: 'users', column: 'email', name: 'users_email_unique' },
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

    for (const { table, column, name } of UNIQUE_COLUMNS) {
        const indexes = await queries.showIndex(table);
        const unique = indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === column);
        if (unique) continue;
        // Duplicates would make the index fail: say so instead (they need fixing by hand).
        const [duplicates] = await sequelize.query(`SELECT ${column} FROM ${table} GROUP BY ${column} HAVING COUNT(*) > 1 LIMIT 5`);
        if (duplicates.length) {
            console.error(`Database: ${table}.${column} has duplicates (${duplicates.length}+), so it is not made unique. Fix them, then restart.`);
            continue;
        }
        await queries.addIndex(table, [column], { unique: true, name });
        console.log(`Database: ${table}.${column} is unique now.`);
    }
};
