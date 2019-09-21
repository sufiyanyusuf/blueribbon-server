
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Listing extends Model {
  static get tableName() {
    return 'Listings';
  }
  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const organizations = require('./organization');
    return{
        listings:{
            relation: Model.BelongsToOneRelation,
            modelClass:organizations,
            join:{
                from : 'listings.organization_id',
                to : 'organizations.id'
            }
        }
    }
  }
}

module.exports = Listing;