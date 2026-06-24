import { gql } from 'graphql-tag';

export default gql`
  type ListingImage {
    url: String!
    publicId: String!
    isPrimary: Boolean!
  }

  type Listing {
    _id: ID!
    title: String!
    description: String!
    price: Float
    priceNegotiable: Boolean!
    priceLabel: String
    currency: String!
    category: Category!
    subcategory: Category
    seller: PublicProfile!
    images: [ListingImage!]!
    state: String!
    city: String
    lga: String
    address: String
    condition: String
    status: String!
    moderationStatus: String!
    isSold: Boolean!
    isFeatured: Boolean!
    isBoosted: Boolean!
    views: Int!
    saves: Int!
    chatCount: Int!
    reportCount: Int!
    isFlagged: Boolean!
    tags: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type ListingPagination {
    total: Int!
    page: Int!
    pages: Int!
    data: [Listing!]!
  }

  input ListingImageInput {
    url: String!
    publicId: String!
    isPrimary: Boolean
  }

  input CreateListingInput {
    title: String!
    description: String!
    price: Float
    priceNegotiable: Boolean
    priceLabel: String
    category: ID!
    subcategory: ID
    images: [ListingImageInput!]
    state: String!
    city: String
    lga: String
    address: String
    condition: String
    tags: [String!]
  }

  input UpdateListingInput {
    title: String
    description: String
    price: Float
    priceNegotiable: Boolean
    priceLabel: String
    images: [ListingImageInput!]
    state: String
    city: String
    condition: String
    tags: [String!]
  }

  input ListingFilters {
    category: ID
    subcategory: ID
    state: String
    city: String
    lga: String
    minPrice: Float
    maxPrice: Float
    condition: String
    isFeatured: Boolean
    isBoosted: Boolean
    sort: String
    page: Int
    limit: Int
  }

  extend type Query {
    listings(filters: ListingFilters): ListingPagination!
    listing(id: ID!): Listing!
    myListings(status: String, page: Int, limit: Int): ListingPagination!
    savedListings: [Listing!]!
    searchListings(q: String!, filters: ListingFilters): ListingPagination!
  }

  extend type Mutation {
    createListing(input: CreateListingInput!): Listing!
    updateListing(id: ID!, input: UpdateListingInput!): Listing!
    deleteListing(id: ID!): Boolean!
    markListingSold(id: ID!): Listing!
    toggleSaveListing(id: ID!): Boolean!
  }
`;