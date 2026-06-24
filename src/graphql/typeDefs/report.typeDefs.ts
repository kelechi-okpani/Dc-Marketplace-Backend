import { gql } from 'graphql-tag';

export default gql`
  type Report {
    _id: ID!
    reporter: PublicProfile!
    targetType: String!
    targetListing: Listing
    targetUser: PublicProfile
    reason: String!
    description: String
    status: String!
    priority: String!
    actionTaken: String
    createdAt: String!
  }

  type ReportList {
    total: Int!
    data: [Report!]!
  }

  input SubmitReportInput {
    targetType: String!
    targetListing: ID
    targetUser: ID
    reason: String!
    description: String
  }

  extend type Query {
    reports(status: String, priority: String, targetType: String, page: Int, limit: Int): ReportList!
  }

  extend type Mutation {
    submitReport(input: SubmitReportInput!): Report!
    resolveReport(id: ID!, status: String!, actionTaken: String, resolutionNote: String): Report!
  }
`;