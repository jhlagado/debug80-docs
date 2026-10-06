var grid as u8[3][2] = [[1, 2], [3, 4], [5, 6]]
var observed as u16 = 0

sub main()
    var row as u16
    var column as u16

    for row = 0 until grid.length
        for column = 0 until grid[row].length
            observed = observed + u16(grid[row][column])
        end
    end
end
