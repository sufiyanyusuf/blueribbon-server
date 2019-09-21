
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Organization extends Model {
  static get tableName() {
    return 'Organizations';
  }

  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const listing = require('./listing');
    return{
        listings:{
            relation: Model.HasManyRelation,
            modelClass:listing,
            join:{
                from : 'Organizations.id',
                to : 'Listings.organization_id'
            }
        }
    }
  }
}

module.exports = Organization;