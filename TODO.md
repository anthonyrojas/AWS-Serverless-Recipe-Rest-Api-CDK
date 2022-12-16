# TODO 

The following is a list of improvements that are pending implementation. 

- [X] Add S3 bucket for recipe pictures
- [X] Add AWS Cognito for user authentication
- [X] Add model classes for DynamoDB items
    - [X] Recipe
    - [X] Ingredients
    - [X] Instructions
- [X] Add `prepTime` to recipes table model
- [X] Add `cookTime` to recipes table model
- [X] Implement single table design while separating by entity type
- [X] Add Models for request body validations to API gateway
- [ ] Add Ratings functionality to the API for users
- [ ] Flesh out README
- [X] Add images a recipe
- [X] Add a pipeline for code changes
- [X] Separate stacks by business domain
    - [X] Lambda Stack
    - [X] ApiGateway Stack
    - [X] Authentication Stack
    - [X] Database Stack
- [X] Add unit tests
- [ ] Add integ tests
- [X] Add primitive search for recipe by name
- [X] (Optional) Upgrade runtime to NodeJS 18
- [ ] Add userId recipe query to get-recipe 