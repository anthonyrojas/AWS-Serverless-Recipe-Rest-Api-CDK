import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    UserPool,
    UserPoolClient,
    AccountRecovery,
    UserPoolClientIdentityProvider,
    UserPoolEmail,
    UserPoolDomain,
    OAuthScope,
} from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends cdk.Stack {

    public readonly userPoolDomain: UserPoolDomain;
    public readonly userPoolClient: UserPoolClient;
    public readonly userPool: UserPool;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const userPool = new UserPool(this, 'RecipeApiUserPool', {
            userPoolName: 'recipe-api-user-pool',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            selfSignUpEnabled: true,
            signInAliases: {email: true},
            autoVerify: {email: true},
            passwordPolicy: {
                minLength: 6
            },
            standardAttributes: {
                givenName: {
                    mutable: true,
                    required: true
                },
                familyName: {
                    required: true,
                    mutable: true
                },
                preferredUsername: {
                    mutable: false,
                    required: true
                },
                profilePicture: {
                    mutable: true,
                    required: false
                },
                birthdate: {
                    mutable: true,
                    required: true
                }
            },
            email: UserPoolEmail.withCognito(),
            accountRecovery: AccountRecovery.EMAIL_ONLY
        });
        const userPoolDomain = userPool.addDomain('RecipeApiUserPoolDomain', {
            cognitoDomain: {
                domainPrefix: 'serverlessrecipeapiauth'
            }
        });
        const userPoolClient: UserPoolClient = userPool.addClient('RecipeApiUserPoolClient', {
            userPoolClientName: 'RecipeApiUserPoolClient',
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                custom: true,
                userSrp: true,
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO
            ],
            oAuth: {
                scopes: [
                    OAuthScope.COGNITO_ADMIN,
                    OAuthScope.OPENID
                ],
                flows: {
                    implicitCodeGrant: true,
                    authorizationCodeGrant: true,
                    clientCredentials: false
                }
            },
        });
        this.userPool = userPool;
        this.userPoolClient = userPoolClient;
        this.userPoolDomain = userPoolDomain;
    }
}