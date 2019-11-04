
exports.up = function(knex) {
    return knex.schema
    .alterTable('Organizations', function(t) {   
        t.unique('logo')
    })
    .alterTable('User_Subscriptions', function(t) {   
        t.string('brand_logo').references('logo').inTable('Organizations').onUpdate('cascade').alter();
    })
};

exports.down = function(knex) {
    return knex.schema
    .alterTable('User_Subscriptions', function(t) {   
        t.dropForeign('brand_logo')
    })
    .alterTable('Organizations', function(t) {
        t.dropUnique('logo')
    })
};
