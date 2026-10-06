record Pair
    left as u8
    right as u8
end

var first as Pair = (3, 4)
var second as Pair
var observed as u16 = 0

sub selected(useFirst as boolean) as Pair
    if useFirst
        return first
    end
    return second
end

sub copyPair(source as Pair, destination as Pair)
    destination = source
end

sub main()
    copyPair(selected(true), second)
    observed = u16(second.left) * 10 + u16(second.right)
end
