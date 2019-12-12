
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Organization extends Model {
  static get tableName() {
    return 'Organizations';
  }

  static get relationMappings() {
    
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