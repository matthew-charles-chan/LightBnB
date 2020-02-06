const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
})

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  if (!email) return null; 
  return pool.query(`SELECT * from users where email = $1`, [email])
    .then(res => {
      return res.rows[0];
    })
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query('SELECT * from users where id = $1', [id])
    .then(res => {
      return res.rows[0];
    })
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
  
  const addUser =  function(user) {
    console.log(user.email)
    return pool.query(`INSERT INTO users (name, password, email) VALUES ($1, $2, $3)`, [user.name, user.password, user.email])
      .then(getUserWithEmail(user.email))
  }
  exports.addUser = addUser;
   
  /// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id) {
  return pool.query(`
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN reservations ON properties.id = property_id
    JOIN property_reviews on properties.id= property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date > now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT 10    
  `,[guest_id])
  .then(res => res.rows);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit=10) {
  const queryParams = [];

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM property_reviews
    JOIN properties on properties.id = property_id
    `;
  if(options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}
    `;
  }
  if(options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryParams.length === 1? queryString += `WHERE owner_id = $${queryParams.length}
    `: queryString += `AND owner_id = $${queryParams.length}
    `;
  }
  if(options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.length === 1?  queryString += `WHERE cost_per_night >  $${queryParams.length}
    `: queryString += `AND cost_per_night >  $${queryParams.length}
    `;
  }
  if(options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    queryParams.length === 1? queryString += `WHERE cost_per_night <  $${queryParams.length}
    `: queryString += `AND cost_per_night <  $${queryParams.length}
    `;
  }
  
  if(options.minimum_rating) {
    queryParams.push(options.minimum_rating, limit);
    queryString += `
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length-1}
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  } else {
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  }
  
  
  console.log(queryString, queryParams);
  

  return pool.query(queryString, queryParams)
    .then(res => res.rows);

}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
  