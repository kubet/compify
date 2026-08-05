import ColorSwatch from "./ColorSwatch";
import getContrastText from "./generate-pallet";


const ShowPalette = ({ pallets }) => {
    return <div className="space-y-6">
        {pallets?.map((p, index) => (
            <div key={index}>
                <h5 className="text-lg font-semibold mb-2">{p.name || 'Primary'}</h5>
                <div className="flex space-x-2 pb-2">
                    {p?.palette?.map((color, index) => (
                        <ColorSwatch key={index} color={color.value} textColor={getContrastText(color.value)} name={index * 100} />
                    ))}
                </div>
            </div>
        ))}

    </div>
}

export default ShowPalette;
