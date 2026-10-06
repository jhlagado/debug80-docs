var counter as u16 = 0
var observed as u16 = 0

sub addOne()
    counter = counter + 1
end

sub main()
    addOne()
    addOne()
    observed = counter
end
