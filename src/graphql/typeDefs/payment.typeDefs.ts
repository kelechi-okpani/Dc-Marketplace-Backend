import { gql } from 'graphql-tag';

export default gql`
  type Payment {
    _id: ID!
    user: ID!
    listing: ID
    type: String!
    amount: Float!
    currency: String!
    status: String!
    gateway: String
    gatewayReference: String
    paidAt: String
    createdAt: String!
  }

  type PaymentInitResponse {
    payment: Payment!
    authorizationUrl: String!
  }

  extend type Query {
    myPayments: [Payment!]!
  }

  extend type Mutation {
    initializePayment(packageId: ID!, listingId: ID!): PaymentInitResponse!
  }
`;