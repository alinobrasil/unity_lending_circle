import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
import { FC } from 'react';
import { Address } from 'wagmi';
import { type } from 'os';


const sampleRows = [
  '0x42A2C59dCF95D804131C859A8382aC49d55b04bd',
  '0xFC78985EBC569796106dd4b350a3e0Ac6c5c110c',
  '0x9343e38cFfccCb4996C76eD56C97c7f27560917b',
];


const ParticipantsTable: FC<any> = ({ rows = sampleRows, showCondition = false, handleClick }) => {

  if (rows.length == 0) {
    return (
      <div>
        <p className='font-bold'>None</p>
      </div>
    )
  }

  function shortenAddress(givenAddress: any, chars = 4) {
    if (!givenAddress) return "";
    const prefix = givenAddress.substring(0, 2 + chars);
    const suffix = givenAddress.substring(givenAddress.length - chars);
    return `${prefix}...${suffix}`;
  }


  return (
    <TableContainer component={Paper} sx={{ maxWidth: 500 }}>
      <Table sx={{ minWidth: 300 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell >Address</TableCell>
            <TableCell ></TableCell>
            <TableCell ></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row: Address) => (
            <TableRow
              key={row}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {shortenAddress(row)}
              </TableCell>

              <TableCell>
                <Link href={`/user/${row}`}>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded"
                  >
                    View
                  </button>
                </Link>
              </TableCell>

              <TableCell >
                {showCondition ?
                  (
                    <button
                      className="bg-green-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
                      onClick={() => handleClick(row)}
                    >
                      Approve
                    </button>
                  ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ParticipantsTable;