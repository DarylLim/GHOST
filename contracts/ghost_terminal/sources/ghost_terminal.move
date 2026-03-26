/// GHOST Terminal — Smart Storage Unit Extension for EVE Frontier
///
/// This module implements the on-chain presence of GHOST (Guided Heuristic
/// Onboard Survival Tactician). When deployed as an SSU extension, players
/// can fly to the terminal in Stillness, press F, and interact with GHOST
/// through the in-game dApp.
///
/// Architecture follows the EVE Frontier builder-scaffold pattern:
/// - Uses typed witness pattern (`GhostAuth`) for SSU extension authorization
/// - Registers with SSU via `world::storage_unit::authorize_extension<GhostAuth>`
/// - Can perform extension-authorized deposit/withdraw on the SSU
/// - Emits events for the off-chain service to track interactions
/// - Stores terminal config as dynamic fields on the shared ExtensionConfig
#[allow(unused_use)]
module ghost_terminal::ghost_terminal;

use ghost_terminal::config::{Self, AdminCap, GhostAuth, ExtensionConfig};
use sui::clock::Clock;
use sui::event;
use world::{
    access::OwnerCap,
    character::Character,
    storage_unit::StorageUnit,
};

// ========== Errors ==========

#[error(code = 0)]
const ENoTerminalConfig: vector<u8> = b"Missing TerminalConfig on ExtensionConfig";

#[error(code = 1)]
const ETerminalInactive: vector<u8> = b"Terminal is not active";

// ========== Config types (stored as dynamic fields) ==========

/// Per-terminal configuration stored as a dynamic field on ExtensionConfig.
public struct TerminalConfig has drop, store {
    /// Human-readable terminal name
    name: vector<u8>,
    /// Whether the terminal is accepting interactions
    active: bool,
    /// Total activation count
    activation_count: u64,
    /// Timestamp of registration
    registered_at: u64,
}

/// Dynamic-field key for TerminalConfig.
public struct TerminalConfigKey has copy, drop, store {}

// ========== Events ==========

/// Emitted when a player activates GHOST at a terminal.
/// The off-chain service polls for these via suix_queryEvents.
public struct GhostActivation has copy, drop {
    terminal_obj_id: address,
    player: address,
    timestamp: u64,
    activation_type: u8,
}

/// Emitted when a player submits a query through GHOST.
public struct GhostQuery has copy, drop {
    terminal_obj_id: address,
    player: address,
    query_type: u8,
    timestamp: u64,
}

/// Emitted when a terminal is registered.
public struct TerminalRegistered has copy, drop {
    terminal_obj_id: address,
    name: vector<u8>,
    registered_by: address,
    timestamp: u64,
}

// ========== Admin: Setup ==========

/// Register the GHOST extension on a Smart Storage Unit.
/// The SSU owner calls this after deploying the SSU in-game.
/// This authorizes the `GhostAuth` witness type on the SSU,
/// enabling GHOST extension logic to interact with it.
public fun register_extension(
    storage_unit: &mut StorageUnit,
    owner_cap: &OwnerCap<StorageUnit>,
) {
    storage_unit::authorize_extension<GhostAuth>(storage_unit, owner_cap);
}

/// Configure terminal metadata on the shared ExtensionConfig.
public fun configure_terminal(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    name: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let now = clock.timestamp_ms();
    extension_config.set_rule<TerminalConfigKey, TerminalConfig>(
        admin_cap,
        TerminalConfigKey {},
        TerminalConfig {
            name: copy name,
            active: true,
            activation_count: 0,
            registered_at: now,
        },
    );

    event::emit(TerminalRegistered {
        terminal_obj_id: ctx.sender(),
        name,
        registered_by: ctx.sender(),
        timestamp: now,
    });
}

/// Deactivate the terminal.
public fun deactivate_terminal(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
) {
    assert!(
        extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {}),
        ENoTerminalConfig,
    );
    let cfg = extension_config.borrow_rule_mut<TerminalConfigKey, TerminalConfig>(
        admin_cap,
        TerminalConfigKey {},
    );
    cfg.active = false;
}

// ========== Player interactions ==========

/// Record a player activation at the GHOST terminal.
/// Called by the dApp when a player opens the terminal (press F).
/// activation_type: 0=opened, 1=query, 2=alert_acknowledged
public entry fun activate(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    activation_type: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(
        extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {}),
        ENoTerminalConfig,
    );

    let cfg = extension_config.borrow_rule_mut<TerminalConfigKey, TerminalConfig>(
        admin_cap,
        TerminalConfigKey {},
    );
    assert!(cfg.active, ETerminalInactive);
    cfg.activation_count = cfg.activation_count + 1;

    event::emit(GhostActivation {
        terminal_obj_id: ctx.sender(),
        player: ctx.sender(),
        timestamp: clock.timestamp_ms(),
        activation_type,
    });
}

/// Record a query from a player.
/// query_type: 0=status, 1=threat, 2=route, 3=tutorial
public entry fun submit_query(
    extension_config: &ExtensionConfig,
    query_type: u8,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(
        extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {}),
        ENoTerminalConfig,
    );

    event::emit(GhostQuery {
        terminal_obj_id: ctx.sender(),
        player: ctx.sender(),
        query_type,
        timestamp: clock.timestamp_ms(),
    });
}

/// Extension-authorized deposit: allow a player to deposit an item
/// into the GHOST Terminal SSU's inventory via the extension auth.
public fun ghost_deposit(
    storage_unit: &mut StorageUnit,
    character: &Character,
    item: world::item::Item,
    ctx: &mut TxContext,
) {
    storage_unit.deposit_item<GhostAuth>(
        character,
        item,
        config::ghost_auth(),
        ctx,
    );
}

/// Extension-authorized withdraw: allow retrieval of items from
/// the GHOST Terminal SSU via extension auth.
public fun ghost_withdraw(
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    quantity: u32,
    ctx: &mut TxContext,
): world::item::Item {
    storage_unit.withdraw_item<GhostAuth>(
        character,
        config::ghost_auth(),
        type_id,
        quantity,
        ctx,
    )
}

// ========== View functions ==========

public fun terminal_name(extension_config: &ExtensionConfig): vector<u8> {
    assert!(
        extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {}),
        ENoTerminalConfig,
    );
    extension_config.borrow_rule<TerminalConfigKey, TerminalConfig>(TerminalConfigKey {}).name
}

public fun is_active(extension_config: &ExtensionConfig): bool {
    if (!extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {})) {
        return false
    };
    extension_config.borrow_rule<TerminalConfigKey, TerminalConfig>(TerminalConfigKey {}).active
}

public fun activation_count(extension_config: &ExtensionConfig): u64 {
    assert!(
        extension_config.has_rule<TerminalConfigKey>(TerminalConfigKey {}),
        ENoTerminalConfig,
    );
    extension_config
        .borrow_rule<TerminalConfigKey, TerminalConfig>(TerminalConfigKey {})
        .activation_count
}
