
const { Model } = require('objection');
const knex = require('../knex')

Model.knex(knex)

class Stepper extends Model {
  static get tableName() {
    return 'Elements_Steppers';
  }

  static get relationMappings() {

    const modifier = require('./modifier');

    return{
        modifier:{
            relation: Model.BelongsToOneRelation,
            modelClass:modifier,
            join:{
                from : 'Elements_Steppers.modifier_id',
                to : 'Modifiers.id'
            }
        }
    }

  }

}

module.exports = Stepper;