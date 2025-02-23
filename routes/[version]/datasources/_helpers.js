const { insertUserDataSource, deleteUserDataSource, selectUsersByIds } = require('../../../services/db');
const { createDataSource, getDataSources, deleteDataSource } = require('../../../services/backend');

module.exports = {
    deleteAndClearDataSource,
    getAndPrepareDataSources,
    createAndSaveDataSource,
};

async function createAndSaveDataSource(userId, content) {
    const { data = {} } = await createDataSource(content);

    if (!data.uuid) {
        throw 'Data source UUID is not available';
    }

    return insertUserDataSource(userId, { uuid: data.uuid });
}

async function getAndPrepareDataSources(datasources = []) {
    const { uuids, ds } = datasources.reduce(
        (acc, { uuid, ...other }) => {
            acc.uuids.push(uuid);
            acc.ds.push(other);
            return acc;
        },
        { uuids: [], ds: [] }
    );

    if (!uuids.length) return [];

    const { data = [] } = await getDataSources(uuids);

    if (!data.length) return [];

    const users = await selectUsersByIds(ds.map((ds) => ds.userId));

    return data.reduce((acc, { uuid, ...data }) => {
        const i = uuids.indexOf(uuid);
        const user = users.find(user => user.id === ds[i].userId);
        acc.push(Object.assign(data, { ...ds[i], user }));
        return acc;
    }, []);
}

async function deleteAndClearDataSource(userId, id) {
    const { uuid } = await deleteUserDataSource(userId, id);
    await deleteDataSource(uuid);
    return uuid;
}
