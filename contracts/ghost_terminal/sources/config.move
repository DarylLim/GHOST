/// GHOST Terminal extension configuration.
///
/// Follows the EVE Frontier builder-scaffold pattern:
/// - Publishes a shared `ExtensionConfig` object at init
/// - Issues an `AdminCap` to the deployer
/// - Defines `GhostAuth` witness for typed extension authorization
/// - Uses dynamic fields for extensible configuration
module ghost_terminal::config;

use sui::dynamic_field as df;

/// Shared configuration object for the GHOST Terminal extension.
/// Other modules in this package attach typed rules via dynamic fields.
public struct ExtensionConfig has key {
    id: UID,
}

/// Admin capability transferred to deployer at publish time.
public struct AdminCap has key, store {
    id: UID,
}

/// Typed witness for SSU extension authorization.
/// Only this package can mint GhostAuth, ensuring only GHOST
/// extension logic can call world::storage_unit operations
/// that require this auth type.
public struct GhostAuth has drop {}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = ExtensionConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

// === Dynamic field helpers ===

public fun has_rule<K: copy + drop + store>(config: &ExtensionConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(config: &ExtensionConfig, key: K): &V {
    df::borrow(&config.id, key)
}

public fun borrow_rule_mut<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): &mut V {
    df::borrow_mut(&mut config.id, key)
}

public fun add_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    df::add(&mut config.id, key, value);
}

public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_(&config.id, copy key)) {
        let _old: V = df::remove(&mut config.id, copy key);
    };
    df::add(&mut config.id, key, value);
}

public fun remove_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): V {
    df::remove(&mut config.id, key)
}

/// Mint a `GhostAuth` witness. Package-restricted to prevent unauthorized use.
public(package) fun ghost_auth(): GhostAuth {
    GhostAuth {}
}
