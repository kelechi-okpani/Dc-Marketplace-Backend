import { gql } from 'graphql-tag';

export default gql`
  type ModerationQueue {
    total: Int!
    data: [Listing!]!
  }

  extend type Query {
    moderationQueue(page: Int, limit: Int): ModerationQueue!
  }

  extend type Mutation {
    approveListing(id: ID!): Listing!
    rejectListing(id: ID!, reason: String!, note: String): Listing!
    flagListing(id: ID!, note: String): Listing!
  }
`;