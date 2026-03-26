/// GHOST Terminal — Smart Storage Unit Extension for EVE Frontier
///
/// This module implements the on-chain presence of GHOST (Guided Heuristic
/// Onboard Survival Tactician). When deployed as an SSU extension, players
/// can fly to the terminal in Stillness, press F, and interact with GHOST
/// through the in-game dApp.
///
/// Architecture:
/// - Uses typed witness pattern for SSU extension authorization
/// - Emits events for off-chain service to track interactions
/// - Stores per-terminal configuration on-chain
module ghost::ghost_terminal {
    use sui::event;
    use sui::clock::Clock;
    use sui::table::{Self, Table};

    // ========== Error codes ==========
    const E_NOT_AUTHORIZED: u64 = 0;
    const E_TERMINAL_NOT_FOUND: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;

    // ========== Activation types ==========
    const ACTIVATION_OPENED: u8 = 0;
    const ACTIVATION_QUERY: u8 = 1;
    const ACTIVATION_ALERT_ACK: u8 = 2;

    // ========== Query types ==========
    const QUERY_STATUS: u8 = 0;
    const QUERY_THREAT: u8 = 1;
    const QUERY_ROUTE: u8 = 2;
    const QUERY_TUTORIAL: u8 = 3;

    // ========== Witness for extension authorization ==========
    /// One-time witness for typed auth with EVE Frontier's World framework.
    /// Used to register this extension with Smart Storage Units.
    public struct GHOST_TERMINAL has drop {}

    // ========== On-chain state ==========

    /// Registry of all GHOST terminals. Shared object.
    public struct GhostRegistry has key {
        id: UID,
        /// Maps terminal SSU item ID → terminal config
        terminals: Table<u64, TerminalConfig>,
        /// Total activations across all terminals
        total_activations: u64,
        /// Admin address (deployer)
        admin: address,
    }

    /// Per-terminal configuration stored on-chain
    public struct TerminalConfig has store, drop {
        /// SSU item ID this terminal is attached to
        ssu_item_id: u64,
        /// Human-readable name
        name: vector<u8>,
        /// Whether the terminal is active
        active: bool,
        /// Total activations at this terminal
        activation_count: u64,
        /// Timestamp of registration
        registered_at: u64,
    }

    // ========== Events ==========

    /// Emitted when a player activates GHOST at a terminal.
    /// The off-chain service polls for these via suix_queryEvents.
    public struct GhostActivation has copy, drop {
        terminal_id: u64,
        player: address,
        timestamp: u64,
        activation_type: u8,
    }

    /// Emitted when a player submits a query through GHOST.
    /// Allows the off-chain service to track query patterns.
    public struct GhostQuery has copy, drop {
        terminal_id: u64,
        player: address,
        query_type: u8,
        timestamp: u64,
    }

    /// Emitted when a new terminal is registered.
    public struct TerminalRegistered has copy, drop {
        terminal_id: u64,
        name: vector<u8>,
        registered_by: address,
        timestamp: u64,
    }

    /// Emitted when a terminal is deactivated.
    public struct TerminalDeactivated has copy, drop {
        terminal_id: u64,
        timestamp: u64,
    }

    // ========== Init ==========

    /// Module initializer — creates the shared GhostRegistry.
    fun init(ctx: &mut TxContext) {
        let registry = GhostRegistry {
            id: object::new(ctx),
            terminals: table::new(ctx),
            total_activations: 0,
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(registry);
    }

    // ========== Admin functions ==========

    /// Register a new GHOST terminal attached to an SSU.
    /// Called by the deployer after publishing + deploying the SSU in-game.
    public entry fun register_terminal(
        registry: &mut GhostRegistry,
        ssu_item_id: u64,
        name: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_AUTHORIZED);
        assert!(!table::contains(&registry.terminals, ssu_item_id), E_ALREADY_REGISTERED);

        let now = sui::clock::timestamp_ms(clock);
        let config = TerminalConfig {
            ssu_item_id,
            name: copy name,
            active: true,
            activation_count: 0,
            registered_at: now,
        };

        table::add(&mut registry.terminals, ssu_item_id, config);

        event::emit(TerminalRegistered {
            terminal_id: ssu_item_id,
            name,
            registered_by: tx_context::sender(ctx),
            timestamp: now,
        });
    }

    /// Deactivate a terminal (admin only).
    public entry fun deactivate_terminal(
        registry: &mut GhostRegistry,
        ssu_item_id: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_AUTHORIZED);
        assert!(table::contains(&registry.terminals, ssu_item_id), E_TERMINAL_NOT_FOUND);

        let config = table::borrow_mut(&mut registry.terminals, ssu_item_id);
        config.active = false;

        event::emit(TerminalDeactivated {
            terminal_id: ssu_item_id,
            timestamp: sui::clock::timestamp_ms(clock),
        });
    }

    // ========== Player interaction functions ==========

    /// Record a player activation at a GHOST terminal.
    /// Called by the dApp when a player opens the terminal.
    public entry fun activate(
        registry: &mut GhostRegistry,
        ssu_item_id: u64,
        activation_type: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&registry.terminals, ssu_item_id), E_TERMINAL_NOT_FOUND);

        let config = table::borrow_mut(&mut registry.terminals, ssu_item_id);
        config.activation_count = config.activation_count + 1;
        registry.total_activations = registry.total_activations + 1;

        event::emit(GhostActivation {
            terminal_id: ssu_item_id,
            player: tx_context::sender(ctx),
            timestamp: sui::clock::timestamp_ms(clock),
            activation_type,
        });
    }

    /// Record a query from a player.
    public entry fun submit_query(
        registry: &mut GhostRegistry,
        ssu_item_id: u64,
        query_type: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&registry.terminals, ssu_item_id), E_TERMINAL_NOT_FOUND);

        event::emit(GhostQuery {
            terminal_id: ssu_item_id,
            player: tx_context::sender(ctx),
            query_type,
            timestamp: sui::clock::timestamp_ms(clock),
        });
    }

    // ========== View functions ==========

    /// Check if a terminal is registered and active.
    public fun is_terminal_active(registry: &GhostRegistry, ssu_item_id: u64): bool {
        if (!table::contains(&registry.terminals, ssu_item_id)) {
            return false
        };
        let config = table::borrow(&registry.terminals, ssu_item_id);
        config.active
    }

    /// Get total activations across all terminals.
    public fun total_activations(registry: &GhostRegistry): u64 {
        registry.total_activations
    }

    /// Get activation count for a specific terminal.
    public fun terminal_activation_count(registry: &GhostRegistry, ssu_item_id: u64): u64 {
        assert!(table::contains(&registry.terminals, ssu_item_id), E_TERMINAL_NOT_FOUND);
        let config = table::borrow(&registry.terminals, ssu_item_id);
        config.activation_count
    }
}
