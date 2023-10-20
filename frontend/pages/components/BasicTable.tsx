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

function createData(
  id: string,
  name: string,
  numberOfPeriods: number,
  currentPeriodNumber: number
) {
  return { id, name, numberOfPeriods, currentPeriodNumber };
}

const sampleRows = [
  createData('0', "[sample] Motorcycle", 3, 0),
  createData('1', "[sample] Masters Tuition", 4, 1),
  createData('2', "[sample] Buying car", 5, 6),
];

type Row = {
  id: string;
  name: string;
  numberOfPeriods: number;
  currentPeriodNumber: number;
};

type CirclesArray = {
  rows: Row[];
};

function getStatus(row: Row): string {
  const currentPeriodNumber = row.currentPeriodNumber
  if (currentPeriodNumber == 0) {
    return "Pending"
  } else if (currentPeriodNumber <= row.numberOfPeriods) {
    return "Active"
  } else {
    return "Completed"
  }
}

const BasicTable: FC<CirclesArray> = ({ rows = sampleRows }) => {
  return (

    <TableContainer component={Paper} sx={{ maxWidth: 500 }}>
      <Table sx={{ minWidth: 400 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell >Circle ID</TableCell>
            <TableCell >Name</TableCell>
            <TableCell >Status</TableCell>
            <TableCell >View</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell >{row.name}</TableCell>
              <TableCell>{getStatus(row)}</TableCell>
              <TableCell>
                <Link href={`/circle/${row.id}`}>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded"                  >
                    View
                  </button>
                </Link></TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default BasicTable;