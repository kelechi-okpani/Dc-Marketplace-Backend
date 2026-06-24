import { gql } from 'graphql-tag';

export default gql`
  type Review {
    _id: ID!
    reviewer: PublicProfile!
    reviewee: PublicProfile!
    listing: Listing
    rating: Int!
    comment: String
    type: String!
    createdAt: String!
  }

  input CreateReviewInput {
    reviewee: ID!
    listing: ID
    rating: Int!
    comment: String
    type: String!
  }

  extend type Query {
    userReviews(userId: ID!): [Review!]!
  }

  extend type Mutation {
    createReview(input: CreateReviewInput!): Review!
  }
`;