# Backend for Blueribbon.io B2B business facing dashboard & B2B2C consumer facing mobile app, 
(Blueribbon.io was a startup I started building during fall of 2019, to help businesses sell products and services as subscriptions).

Things I enjoyed while building this
- Implemented an authentication system using Auth0 (Understood a lot of security and multi-tenant apps)
- Implemented a consumer facing subscription management system using a Finite State Machine, that ensured the consumer once subscribed to a product is in the right state during different events like 
  - non-payment 
  - delivery failures
  - renewals
  - expiry
  - late renewals
- Continuous delivery, using Heroku's pipelines

The project was started with Node, Express, Postgres, & Javascript. Along the journey, I discovered typescript after getting into a mess with lack of typesafety with javascript. Moved a lot of parts to TS, and haven't looked back since yet to JS. 

  
