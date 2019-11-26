
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class FulfilledStates extends Model {

  static get tableName() {
    return 'Fulfilled_States';
  }

}

module.exports = FulfilledStates;