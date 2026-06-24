import { gql } from 'graphql-tag';

export default gql`
  type ReferralCampaign {
    _id: ID!
    name: String!
    code: String!
    type: String!
    stateCode: String
    churchName: String
    coordinatorName: String
    isActive: Boolean!
    totalClicks: Int!
    totalRegistrations: Int!
    totalListings: Int!
    totalSellers: Int!
    createdAt: String!
  }

  extend type Query {
    referralCampaign(code: String!): ReferralCampaign!
  }
`;