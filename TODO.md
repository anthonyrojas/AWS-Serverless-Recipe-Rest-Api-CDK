# TODO 

The following is a list of improvements that are pending implementation. 

- [X] Add S3 bucket for recipe pictures
- [X] Add AWS Cognito for user authentication
- [X] Add model classes for DynamoDB items
    - [X] Recipe
    - [X] Ingredients
    - [X] Steps
- [X] Add `prepTime` to recipes table model
- [X] Add `cookTime` to recipes table model
- [X] Implement single table design while separating by entity type
- [ ] Add Models for request body validations to API gateway
- [ ] Add Ratings functionality to the API for users
- [ ] Flesh out README
- [ ] Add a pipeline for code changes
- [ ] Separate stacks by business domain
    - [ ] LambdaStack
    - [ ] ApiGateway Stack
    - [ ] Authentication Stack
- [ ] (Optional) Migrate Lambda functions to python