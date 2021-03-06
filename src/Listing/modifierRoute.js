const express = require('express');
const ModifierRouter = express.Router();
const Modifier = require('../../db/models/modifier');


ModifierRouter.route('/:listing_id').get(async function (req, res){
    let listing_id = parseInt(req.params.listing_id)
    Modifier.query()
        .where('listing_id', listing_id)
        .then(modifiers => {
            res.json(modifiers)
        })
});

ModifierRouter.route('/remove/:modifier_id').delete(async function (req, res) {
    console.log('remove')
    let modifier_id = parseInt(req.params.modifier_id)
    console.log(modifier_id,typeof(modifier_id));
    try {
        const count = await Modifier.query().deleteById(modifier_id);
        res.sendStatus(200)
    }catch(e){
        console.log(e);
    }
});

ModifierRouter.route('/create').post(async function (req, res) {

    const newModifier = {
        title:req.body.title,
        description:req.body.description,
        type:req.body.type,
        order:req.body.order,
        listing_id:req.body.listing_id,
        element_type:req.body.element_type
    };

    const getTextField = () => {
        if (req.body.element_type && req.body.element_type == "Textfield"){
            const newTextfield = {
                placeholder:req.body.placeholder
            };
            return newTextfield;
        }
    }

    const getCarousel = () => {
        if (req.body.element_type && req.body.element_type == 'Carousel') {
            const newCarousel = {
                element_type:'carousel',
                mandatory:req.body.mandatory,
                multi_selection:req.body.multi_selection,
            };
            return newCarousel
        }
    }

    const getMultiOptions = () => {
        if (req.body.element_type && req.body.element_type == 'Option List') {
            const newMultiOptions = {
                element_type:'Option List',
                mandatory:req.body.mandatory,
                multi_selection:req.body.multi_selection,
            };
            return newMultiOptions
        }
    }


    const getChoices = () => {
        if (req.body.choices && req.body.choices.length>0) {
            const choices = req.body.choices.map((choice)=>{
                const newChoice = {
                    order:choice.order,
                    title:choice.title,
                    pricing_impact:choice.pricing_impact,
                    icon:choice.icon,
                    image:choice.image,
                    default_selection:choice.default_selection,
                    unit:choice.unit,
                    value:choice.value
                };
                console.log(newChoice);
                return newChoice;
            });
            return choices
        }
    }

    const getStepper = () => {
        if (req.body.element_type == 'Stepper') {
            
            const newStepper = {
                max_value:req.body.maxValue,
                min_value:req.body.minValue,
                step_value:req.body.stepValue,
                price_multiplier:req.body.price_multiplier,
                unit_title:req.body.unit,
            };
           
            return newStepper;
        }
    }

    try{
        const modifier = await Modifier.query().insert(newModifier);
        
        if (getStepper()){
            const stepper = await modifier
            .$relatedQuery('stepper')
            .insert(getStepper());
        }

        if (getTextField()){
            const textField = await modifier
            .$relatedQuery('textField')
            .insert(getTextField());
        }

        if (getCarousel()){
            const carousel = await modifier
            .$relatedQuery('multiOption')
            .insert(getCarousel());

            if (getChoices()){
                const choices = await modifier
                .$relatedQuery('choice')
                .insert(getChoices());
            }
        }

        if (getMultiOptions()){
            const multiOptions = await modifier
            .$relatedQuery('multiOption')
            .insert(getMultiOptions());

            if (getChoices()){
                const choices = await modifier
                .$relatedQuery('choice')
                .insert(getChoices());
            }
        }
        
        res.send({modifier});
    }catch(e){
        console.error(e);
    }

});


module.exports = ModifierRouter;