import { gql } from 'graphql-tag';

export default gql`
  type PromotionPackage {
    _id: ID!
    name: String!
    type: String!
    durationDays: Int!
    price: Float!
    description: String
    isActive: Boolean!
    priority: Int!
  }

  type ActivePromotion {
    _id: ID!
    listing: Listing!
    type: String!
    startsAt: String!
    endsAt: String!
    isActive: Boolean!
    impressions: Int!
    clicks: Int!
  }

  extend type Query {
    promotionPackages: [PromotionPackage!]!
    activePromotions: [ActivePromotion!]!
    myPromotions: [ActivePromotion!]!
  }
`;