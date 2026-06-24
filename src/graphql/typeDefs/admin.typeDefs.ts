import { gql } from 'graphql-tag';

export default gql`
  type DashboardStats {
    totalUsers: Int!
    totalListings: Int!
    activeListings: Int!
    pendingModeration: Int!
    openReports: Int!
  }

  type UserList {
    total: Int!
    data: [User!]!
  }

  type AuditLog {
    _id: ID!
    actor: PublicProfile!
    action: String!
    targetType: String
    details: String
    createdAt: String!
  }

  input CreateReferralCampaignInput {
    name: String!
    code: String!
    type: String!
    stateCode: String
    churchName: String
    coordinatorName: String
  }

  extend type Query {
    adminDashboard: DashboardStats!
    adminUsers(status: String, role: String, search: String, page: Int, limit: Int): UserList!
    adminReferralCampaigns: [ReferralCampaign!]!
    auditLogs: [AuditLog!]!
  }

  extend type Mutation {
    suspendUser(id: ID!, reason: String!, until: String): User!
    restoreUser(id: ID!): User!
    createReferralCampaign(input: CreateReferralCampaignInput!): ReferralCampaign!
  }
`;