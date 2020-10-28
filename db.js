const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL || "postgres:marco:marco@localhost:5432/imageboard"
);

module.exports.getImageDetails = () => {
    const i = `SELECT * FROM images ORDER BY id DESC LIMIT 4`;
    return db.query(i);
};
module.exports.countNumberImages = () => {
    const c = `SELECT COUNT(id) FROM images`;
    return db.query(c);
};
module.exports.insertFile = (url, username, description, title) => {
    const q = `INSERT INTO images (url, username, description, title) VALUES ($1, $2, $3, $4) RETURNING *`;
    const params = [url, username, title, description];
    return db.query(q, params);
};

module.exports.getMoreImages = (id) => {
    const q = `SELECT * FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 3`;
    const params = [id];
    return db.query(q, params);
};

module.exports.getImageForModal = (id) => {
    const i = `SELECT * FROM images WHERE id = $1`;
    const replies = [id];
    return db.query(i, replies);
};

module.exports.getComments = (id) => {
    const i = `SELECT * FROM comments WHERE image_id = $1`;
    const replies = [id];
    return db.query(i, replies);
};

module.exports.getOtherId = (id) => {
    const i = `SELECT * FROM images
                WHERE id = (
                    SELECT MIN(id) FROM images
                        WHERE
                        id > $1
                )
                OR id = (
                    SELECT MAX(id) FROM images
                        WHERE
                        id < $1
                )
                GROUP BY id
                ORDER BY id`;
    const replies = [id];
    return db.query(i, replies);
};

module.exports.addComment = (comment, commentUsername, imageId) => {
    const q = `INSERT INTO comments (comment, username, image_id) VALUES ($1, $2, $3) RETURNING *`;
    const replies = [comment, commentUsername, imageId];
    return db.query(q, replies);
};
module.exports.removeComment = (id) => {
    const d = `DELETE FROM comments WHERE id = $1`;
    const replies = [id];
    return db.query(d, replies);
};

module.exports.deleteComments = (id) => {
    const d = `DELETE FROM comments WHERE image_id = $1`;
    const replies = [id];
    return db.query(d, replies);
};

module.exports.deleteImage = (id) => {
    const d = `DELETE FROM images WHERE id = $1 RETURNING id`;
    const replies = [id];
    return db.query(d, replies);
};
