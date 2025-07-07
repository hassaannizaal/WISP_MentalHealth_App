const db = require('../db');

// Get all resources (for users)
const getAllResources = async () => {
  const queryText = `
    SELECT resource_id, category, title, description, contact_info, link, created_at, updated_at
    FROM professional_resources
    ORDER BY category, title;
  `;
  try {
    const res = await db.query(queryText);
    return res.rows;
  } catch (err) {
    console.error('Error getting all resources:', err);
    throw err;
  }
};

// Admin: Add a new resource
const addResource = async (resourceData) => {
    const { category, title, description, contact_info, link } = resourceData;
     // Basic validation
    const allowedCategories = ['Therapy', 'Hotlines', 'Crisis Centers'];
    if (!allowedCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
    }
    if (!title) throw new Error('Title is required.');

    const queryText = `
        INSERT INTO professional_resources (category, title, description, contact_info, link)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [category, title, description, contact_info, link];
    try {
        const res = await db.query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error adding resource:', err);
        throw err;
    }
};

// Admin: Update an existing resource
const updateResource = async (resourceId, resourceData) => {
    const { category, title, description, contact_info, link } = resourceData;
     // Basic validation
    const allowedCategories = ['Therapy', 'Hotlines', 'Crisis Centers'];
    if (category && !allowedCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
    }
    if (title === '') throw new Error('Title cannot be empty.'); // Check for empty string specifically

    // Build SET clauses dynamically based on provided data
    const fieldsToUpdate = {};
    const values = [resourceId];
    let paramIndex = 2;
    const setClauses = [];

     if (category !== undefined) { setClauses.push(`category = $${paramIndex++}`); values.push(category); }
     if (title !== undefined) { setClauses.push(`title = $${paramIndex++}`); values.push(title); }
     if (description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(description); }
     if (contact_info !== undefined) { setClauses.push(`contact_info = $${paramIndex++}`); values.push(contact_info); }
     if (link !== undefined) { setClauses.push(`link = $${paramIndex++}`); values.push(link); }

     if (setClauses.length === 0) {
        throw new Error('No valid fields provided for update.');
     }

    // updated_at will be handled by trigger
    const queryText = `
        UPDATE professional_resources
        SET ${setClauses.join(', ')}
        WHERE resource_id = $1
        RETURNING *;
    `;

    try {
        const res = await db.query(queryText, values);
         if (res.rows.length === 0) {
             throw new Error('Resource not found or update failed.');
         }
        return res.rows[0];
    } catch (err) {
        console.error('Error updating resource:', err);
        throw err;
    }
};

// Admin: Delete a resource
const deleteResource = async (resourceId) => {
    const queryText = 'DELETE FROM professional_resources WHERE resource_id = $1 RETURNING resource_id;';
    const values = [resourceId];
    try {
        const res = await db.query(queryText, values);
        return res.rows[0]; // Returns deleted resource_id or undefined
    } catch (err) {
        console.error('Error deleting resource:', err);
        throw err;
    }
};


module.exports = {
  getAllResources,
  addResource,    // Admin
  updateResource, // Admin
  deleteResource  // Admin
}; 