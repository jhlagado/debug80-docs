var subtotal as u16 = 120
var postage as u16 = 15
var total as u16 = 0

sub addPostage()
    var amountDue as u16

    amountDue = subtotal + postage
    total = amountDue
end

sub main()
    addPostage()
end
