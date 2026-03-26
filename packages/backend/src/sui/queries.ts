import { getSuiClient } from "./client.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type {
  CharacterProfile,
  ShellState,
  FuelState,
  InventoryState,
  LocationState,
} from "./types.js";

const GRAPHQL_GET_CHARACTER = `
  query GetCharacterDetails($address: SuiAddress!, $profileType: String!) {
    address(address: $address) {
      objects(last: 10, filter: { type: $profileType }) {
        nodes {
          contents {
            ... on MoveObject {
              contents {
                type { repr }
                json
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCharacterByWallet(
  walletAddress: string
): Promise<CharacterProfile | null> {
  try {
    const profileType = `${config.sui.worldPackageId}::player_profile::PlayerProfile`;
    const response = await fetch(config.sui.graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GRAPHQL_GET_CHARACTER,
        variables: { address: walletAddress, profileType },
      }),
    });

    const data = await response.json();
    const nodes = data?.data?.address?.objects?.nodes;
    if (!nodes || nodes.length === 0) return null;

    const profile = nodes[0]?.contents?.contents?.json;
    if (!profile) return null;

    return {
      characterId: profile.character_id || profile.id,
      name: profile.name || "Unknown",
      walletAddress,
    };
  } catch (err) {
    logger.warn({ walletAddress, err }, "Failed to fetch character profile");
    return null;
  }
}

export async function getObjectData(objectId: string): Promise<any | null> {
  try {
    const client = getSuiClient();
    const result = await client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    });
    return result.data;
  } catch (err) {
    logger.warn({ objectId, err }, "Failed to fetch object");
    return null;
  }
}

export async function getOwnedObjects(
  walletAddress: string,
  type?: string
): Promise<any[]> {
  try {
    const client = getSuiClient();
    const result = await client.getOwnedObjects({
      owner: walletAddress,
      filter: type ? { StructType: type } : undefined,
      options: { showContent: true, showType: true },
    });
    return result.data;
  } catch (err) {
    logger.warn({ walletAddress, err }, "Failed to fetch owned objects");
    return [];
  }
}

export async function getShellState(
  _walletAddress: string
): Promise<ShellState | null> {
  // In production, this reads the character's current ship (Shell) state
  // from the EVE Frontier world objects. The exact object types depend on
  // the world-contracts package version deployed on Stillness.
  //
  // For now, returns null — mock mode in context engine fills this in.
  return null;
}

export async function getFuelState(
  _walletAddress: string
): Promise<FuelState | null> {
  return null;
}

export async function getInventoryState(
  _walletAddress: string
): Promise<InventoryState | null> {
  return null;
}

export async function getLocationState(
  _walletAddress: string
): Promise<LocationState | null> {
  return null;
}
