forward sub odd(value as u8) as boolean

sub even(value as u8) as boolean
    if value = 0
        return true
    end
    return odd(value - 1)
end

sub odd
    if value = 0
        return false
    end
    return even(value - 1)
end

var observed as u16 = 0

sub main()
    if odd(7)
        observed = 1
    end
end
