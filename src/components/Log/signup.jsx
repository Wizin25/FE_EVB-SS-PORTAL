import { Link } from 'react-router-dom'

function SignUp() {
    return (
        <div>
            <h2>Sign Up</h2>
            <form>
                <input type="text" placeholder="Username" required /><br/>
                <input type="email" placeholder="Email" required  /><br/>
                <input type="password" placeholder="Password" required  /><br/>
                <input type="text" placeholder="Phone" required /><br/>
                <input type="text" placeholder="Address" /><br/>
                <input type="submit" value="Sign In" />
            </form>
            <p>Already have an account? <Link to="/signin">Sign In</Link></p>
        </div>
    );
}

export default SignUp;