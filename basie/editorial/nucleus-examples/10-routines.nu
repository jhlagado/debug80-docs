var sequence as u8 = 0
var observed as u16 = 0

sub mark(value as u8) as u8
    sequence = sequence * 10 + value
    return value
end

sub choose(left as u8, right as u8) as u8
    if left > right
        return left
    end
    return right
end

sub main()
    observed = u16(choose(mark(2), mark(7))) + u16(sequence)
end
