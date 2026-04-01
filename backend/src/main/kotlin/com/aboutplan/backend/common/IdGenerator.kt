package com.aboutplan.backend.common

import java.util.UUID

object IdGenerator {
    fun prefixed(prefix: String): String = "$prefix-${UUID.randomUUID().toString().replace("-", "").take(12)}"
}
