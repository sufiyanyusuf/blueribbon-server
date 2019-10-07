const express = require('express');
const ServiceLocationRouter = express.Router();

const ServiceLocation = require('../../db/models/serviceLocation');

ServiceLocationRouter.route('/:listing_id').get(async function (req, res) {
    let listing_id = parseInt(req.params.listing_id)
    console.log(listing_id);
    try{

        const areas = await ServiceLocation
                                        .query()
                                        .where('listing_id', listing_id);
                     
        res.json(areas);

    }catch(e){
        console.log(e);
        res.json(e);
    }

});

ServiceLocationRouter.route('/update').post(async function (req, res) {

    const getLocations = () => {
        if (req.body.areas && req.body.areas.length>0 && req.body.listing_id) {
            const areas = req.body.areas.map((area)=>{
                const newServiceLocation = {
                    label:area.label,
                    data_id:area.data_id,
                    polygon:{data:area.polygon},
                    listing_id:req.body.listing_id
                }; 
                return newServiceLocation;
            });
            return areas
        }else{
            return []
        }
    }

    try{
        if (getLocations().length > 0){
            
            const listing_id = getLocations()[0].listing_id
        
            const numDeleted = await ServiceLocation
                                            .query()
                                            .delete()
                                            .where('listing_id', listing_id);
    
            const serviceLocations = await ServiceLocation
                                            .query()
                                            .insert(getLocations());  
                                                               
            res.json(serviceLocations);
        }else{
            if (req.body.listing_id){
                const numDeleted = await ServiceLocation
                                            .query()
                                            .delete()
                                            .where('listing_id', req.body.listing_id);
            }
            res.sendStatus(200)
        }
        

    }catch(e){
        console.log(e);
        res.json(e);
    }

});

module.exports = ServiceLocationRouter;